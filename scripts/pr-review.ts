interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ZAIResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const PR_REVIEWER_SYSTEM_PROMPT =
`You are an expert code reviewer. Review the PR diff and report **only critical issues**.

Focus exclusively on:
- 🐛 **Bugs & Logic Errors** — broken or incorrect behavior
- 🔒 **Security** — vulnerabilities, injection risks, exposed secrets
- ⚡ **Performance** — severe bottlenecks only

Skip minor style, formatting, or non-blocking suggestions.

Format rules:
- Use \`###\` section headers
- Use \`\`\`language\`\`\` for code snippets
- **Bold** critical issues, *italic* for recommended fixes
- Be concise — no fluff, no praise, no summaries`;

async function fetchPRReview(
  prDiff: string,
  prDescription?: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.Z_AI_API_KEY;

  if (!key) {
    throw new Error(
      "Z AI API key is required. Set Z_AI_API_KEY env variable or pass apiKey parameter."
    );
  }

  const userMessage = prDescription
    ? `**PR Description:**\n${prDescription}\n\n**Code Diff:**\n\`\`\`diff\n${prDiff}\n\`\`\``
    : `**Code Diff:**\n\`\`\`diff\n${prDiff}\n\`\`\``;

  const messages: Message[] = [{ role: "user", content: userMessage }];

  const response = await fetch(
    "https://api.z.ai/api/coding/paas/v4/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "glm-4.7",
        messages: [
          { role: "system", content: PR_REVIEWER_SYSTEM_PROMPT },
          ...messages,
        ],
        thinking: {
          type: "enabled"
        },
        temperature: 1.0,
        max_tokens: 8196,
        stream: false,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Z AI API request failed: ${response.status} ${response.statusText}\n${error}`
    );
  }

  const data: ZAIResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response choices returned from Z AI API");
  }

  // try {
  //   // Prepare a timestamped filename to avoid overwriting previous responses
  //   const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  //   const filename = `anthropic-review-response-${timestamp}.json`;
  //   // Save the data object as a JSON string with indentation
  //   await Bun.write(filename, JSON.stringify(data, null, 2));
  //   console.log(`Saved Z AI API response to ${filename}`);
  // } catch (err) {
  //   console.warn("Failed to save Z AI API response JSON file:", err);
  // }

  return data.choices[0].message.content;
}

// --- Streaming variant ---
async function fetchPRReviewStream(
  prDiff: string,
  prDescription?: string,
  apiKey?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const key = apiKey || process.env.Z_AI_API_KEY;

  if (!key) {
    throw new Error("Z AI API key is required.");
  }

  const userMessage = prDescription
    ? `**PR Description:**\n${prDescription}\n\n**Code Diff:**\n\`\`\`diff\n${prDiff}\n\`\`\``
    : `**Code Diff:**\n\`\`\`diff\n${prDiff}\n\`\`\``;

  const response = await fetch(
    "https://api.z.ai/api/paas/v4/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "glm-4-7",
        messages: [
          { role: "system", content: PR_REVIEWER_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        "thinking": {
          "type": "enabled"
        },
        temperature: 1.0,
        max_tokens: 4096,
        stream: true,
      }),
    }
  );

  if (!response.ok || !response.body) {
    const error = await response.text();
    throw new Error(`Z AI API request failed: ${response.status}\n${error}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
          onChunk?.(content);
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  return fullContent;
}

async function getLatestCommitDiffAndMessage(): Promise<{
  diff: string;
  commitMessage: string;
}> {
  const { diff, commitMessages } = await getCommitDiffAndMessages(1);
  return { diff, commitMessage: commitMessages[0] ?? "(No commit message)" };
}

async function getCommitDiffAndMessages(n: number): Promise<{
  diff: string;
  commitMessages: string[];
}> {
  if (n < 1) {
    throw new Error("n must be at least 1");
  }

  let diffProc,logProc
  if (n === -1) {
    // fetch all commits in this PR instead
    // We'll use environment variables set by GitHub Actions to get the PR base and head shas.
    // If they aren't present, fallback to `HEAD` as both base and head.
    const githubEventPath = process.env.GITHUB_EVENT_PATH;
    let baseSha: string | undefined;
    let headSha: string | undefined;

    if (githubEventPath) {
      try {
        const event = JSON.parse(await Bun.file(githubEventPath).text());
        baseSha = event.pull_request?.base?.sha;
        headSha = event.pull_request?.head?.sha;
      } catch {
        // Ignore parse error, fallback below
      }
    }

    // Fallback: use HEAD and HEAD~1 (single commit diff)
    if (!baseSha || !headSha) {
      baseSha = "HEAD~1";
      headSha = "HEAD";
    }

    [diffProc, logProc] = await Promise.all([
      Bun.spawn(["git", "diff", `${baseSha}`, `${headSha}`], {
        stdout: "pipe",
        stderr: "pipe",
      }),
      Bun.spawn([
        "git",
        "log",
        `${baseSha}..${headSha}`,
        "--format=%B---COMMIT_SEP---",
        `${headSha}`,
      ], {
        stdout: "pipe",
        stderr: "pipe",
      }),
    ]);
  } else {
    [diffProc, logProc] = await Promise.all([
      Bun.spawn(["git", "diff", `HEAD~${n}`, "HEAD"], {
        stdout: "pipe",
        stderr: "pipe",
      }),
      Bun.spawn(["git", "log", `-${n}`, "--format=%B---COMMIT_SEP---", "HEAD"], {
        stdout: "pipe",
        stderr: "pipe",
      }),
    ]);
  }

  const [diffExit, logExit, diff, stderr, logOutput] = await Promise.all([
    diffProc.exited,
    logProc.exited,
    new Response(diffProc.stdout).text(),
    new Response(diffProc.stderr).text(),
    new Response(logProc.stdout).text(),
  ]);

  if (diffExit !== 0) {
    console.error("git diff stderr:", stderr);
    throw new Error(`git diff failed with code ${diffExit}`);
  }
  if (logExit !== 0) {
    throw new Error("git log failed");
  }

  const commitMessages = logOutput
    .split("---COMMIT_SEP---")
    .map((m) => m.trim())
    .filter(Boolean);

  return {
    diff: diff.trim() || "(No file changes in these commits)",
    commitMessages: commitMessages.length ? commitMessages : ["(No commit message)"],
  };
}

const PR_COMMENT_MARKER = "<!-- z-ai-pr-review -->";

async function postReviewToPRComment(body: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!token || !repo) {
    console.error("Missing GITHUB_TOKEN or GITHUB_REPOSITORY. Skipping PR comment.");
    return;
  }

  let prNumber: number | null = null;
  if (eventPath) {
    try {
      const event = JSON.parse(await Bun.file(eventPath).text()) as {
        pull_request?: { number?: number };
      };
      prNumber = event.pull_request?.number ?? null;
    } catch {
      console.warn("Could not read GITHUB_EVENT_PATH");
    }
  }

  if (!prNumber) {
    console.error("PR number not found (GITHUB_EVENT_PATH or pull_request). Skipping.");
    return;
  }

  const [owner, repoName] = repo.split("/");
  const commentBody = `${PR_COMMENT_MARKER}\n\n## 🤖 Z.AI Code Review\n\n${body}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  const listRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
    { headers }
  );

  if (!listRes.ok) {
    throw new Error(`GitHub API list comments failed: ${listRes.status}`);
  }

  const comments = (await listRes.json()) as Array<{ id: number; body?: string }>;
  const existing = comments.find((c) => c.body?.includes(PR_COMMENT_MARKER));

  if (existing) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/issues/comments/${existing.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ body: commentBody }),
      }
    );
    if (!res.ok) throw new Error(`GitHub API update comment failed: ${res.status}`);
    console.log("Updated existing PR review comment");
  } else {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ body: commentBody }),
      }
    );
    if (!res.ok) throw new Error(`GitHub API create comment failed: ${res.status}`);
    console.log("Posted new PR review comment");
  }
}

function extractRevNumber (commitMessage: string) {
  // const match = commitMessage.match(/\(rev(\d+)\)/);
  const match = commitMessage.match(/\((?:rev)(-?\d+)\)/);
  return match ? Number(match?.[1]) : 1
}

// --- Example usage ---
async function main() {
  console.log("Fetching revN...")
  const revNObject = await getLatestCommitDiffAndMessage()
  const revN = extractRevNumber(revNObject.commitMessage)

  console.log("Fetching PR diff...");
  const diffObject = await getCommitDiffAndMessages(revN);

  console.log("Fetching PR review...\n");
  const review = await fetchPRReview(
    diffObject.diff,
    diffObject.commitMessages.join("\n")
  );

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_EVENT_PATH) {
    console.log("\nPosting review to PR...");
    await postReviewToPRComment(review);
  }
  console.log("Done.");
}

main().catch(console.error);

// Trigger github action
