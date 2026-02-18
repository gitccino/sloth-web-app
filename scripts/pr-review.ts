#!/usr/bin/env bun
/**
 * PR Review Agent using Z.AI GLM model
 * Fetches PR diff, sends to GLM for review, posts comment on the PR.
 */

const Z_AI_API_URL = "https://api.z.ai/api/paas/v4/chat/completions";
const GLM_MODEL = "glm-4.7-flash"; // Fast & free; use glm-4.7 or glm-5 for deeper analysis

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the pull request diff and provide:
1. **Summary** - Brief overview of changes
2. **Potential Issues** - Bugs, security concerns, edge cases
3. **Suggestions** - Improvements, best practices, refactoring ideas
4. **Positive Notes** - What was done well

Be concise but thorough. Use markdown formatting. Focus on actionable feedback.`;

async function getPrDiff(): Promise<string> {
  const baseRef = process.env.GITHUB_BASE_REF || "main";
  const base = `origin/${baseRef}`;

  const proc = Bun.spawn(["git", "diff", `${base}...HEAD`], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [exitCode, diff, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  if (exitCode !== 0) {
    console.error("git diff stderr:", stderr);
    throw new Error(`git diff failed with code ${exitCode}`);
  }
  if (!diff.trim()) {
    return "(No file changes in this PR)";
  }
  return diff;
}

async function getReviewFromGlm(diff: string): Promise<string> {
  const apiKey = process.env.Z_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Z_AI_API_KEY secret is not set. Add it in repo Settings > Secrets and variables > Actions.");
  }

  const response = await fetch(Z_AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Review this pull request diff:\n\n\`\`\`diff\n${diff.slice(0, 100_000)}\n\`\`\``,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Z.AI API error ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string | null; reasoning_content?: string | null };
    }>;
    error?: { message?: string };
    code?: number;
    message?: string;
  };

  if (data.error) {
    throw new Error(`Z.AI API error: ${data.error.message}`);
  }
  if (data.code && data.code !== 200) {
    throw new Error(`Z.AI API error: ${data.message ?? "Unknown error"}`);
  }

  const msg = data.choices?.[0]?.message;
  const content = msg?.content?.trim();
  const reasoning = msg?.reasoning_content?.trim();

  // Z.AI may put output in content, reasoning_content, or both (thinking models)
  if (content) {
    return reasoning ? `${reasoning}\n\n---\n\n${content}` : content;
  }
  if (reasoning) {
    return reasoning;
  }

  // Debug: log structure without full payload
  const structure = JSON.stringify(
    {
      hasChoices: !!data.choices,
      choicesLen: data.choices?.length ?? 0,
      firstChoice: data.choices?.[0]
        ? {
            hasMessage: !!data.choices[0].message,
            messageKeys: data.choices[0].message
              ? Object.keys(data.choices[0].message)
              : [],
          }
        : null,
    },
    null,
    2
  );
  throw new Error(`No review content in Z.AI response. Response structure: ${structure}`);
}

async function postPrComment(body: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.GITHUB_EVENT_PATH
    ? (JSON.parse(await Bun.file(process.env.GITHUB_EVENT_PATH).text()) as { pull_request?: { number?: number } })
        .pull_request?.number
    : null;

  if (!token || !repo || !prNumber) {
    console.error("Missing GITHUB_TOKEN, GITHUB_REPOSITORY, or PR number. Skipping comment.");
    return;
  }

  const [owner, repoName] = repo.split("/");
  const commentMarker = "<!-- z-ai-pr-review -->";

  // List existing comments to find and update our bot comment
  const listRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  const comments = (await listRes.json()) as Array<{ id: number; body?: string; user?: { type?: string } }>;
  const botComment = comments.find((c) => c.body?.includes(commentMarker));

  const commentBody = `${commentMarker}\n\n## 🤖 Z.AI GLM Code Review\n\n${body}`;

  if (botComment) {
    await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/issues/comments/${botComment.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: commentBody }),
      }
    );
    console.log("Updated existing review comment");
  } else {
    await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: commentBody }),
      }
    );
    console.log("Posted new review comment");
  }
}

async function main() {
  console.log("Fetching PR diff...");
  const diff = await getPrDiff();

  console.log("Sending to Z.AI GLM for review...");
  const review = await getReviewFromGlm(diff);

  console.log("Posting review to PR...");
  await postPrComment(review);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
