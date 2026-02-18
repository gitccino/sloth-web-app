#!/usr/bin/env bun
/**
 * PR Review Agent using Z.AI GLM model
 * Fetches PR diff, sends to GLM for review, posts comment on the PR.
 */

const Z_AI_API_URL = "https://api.z.ai/api/paas/v4/chat/completions";
const GLM_MODEL = "glm-4.7-flash"; // Fast & free; use glm-4.7 or glm-5 for deeper analysis

// const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the pull request diff and provide:
// 1. **Summary** - Brief overview of changes
// 2. **Potential Issues** - Bugs, security concerns, edge cases
// 3. **Suggestions** - Improvements, best practices, refactoring ideas
// 4. **Positive Notes** - What was done well

// Be concise but thorough. Use markdown formatting. Focus on actionable feedback.`;

const SYSTEM_PROMPT = `You are a code reviewer. Output ONLY valid JSON. No other text.

Flag only P0/P1 issues: critical bugs, security, correctness, major performance regressions.
Skip style, typos, minor suggestions. Reference line numbers from the diff (the + lines).

Output format (JSON only):
{"issues":[{"path":"file/path.ts","line":42,"severity":"P1","title":"Short title","body":"Full explanation of the issue and why it matters."}]}

If no issues: {"issues":[]}
Each issue: path (file from diff), line (line number in new file), severity (P0 or P1), title (one short line), body (2-4 sentences explaining the problem).`;

async function getPrDiff(): Promise<string> {
  const proc = Bun.spawn(["git", "diff", "HEAD~1", "HEAD"], {
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

type ReviewIssue = { path: string; line: number; severity: string; title: string; body: string };

async function getCommitSha(): Promise<string> {
  const sha = process.env.GITHUB_SHA;
  if (sha) return sha;
  const proc = Bun.spawn(["git", "rev-parse", "HEAD"], { stdout: "pipe" });
  return (await new Response(proc.stdout).text()).trim();
}

async function postCodexReview(issues: ReviewIssue[]): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.GITHUB_EVENT_PATH
    ? (JSON.parse(await Bun.file(process.env.GITHUB_EVENT_PATH).text()) as { pull_request?: { number?: number } })
        .pull_request?.number
    : null;

  if (!token || !repo || !prNumber) {
    console.error("Missing GITHUB_TOKEN, GITHUB_REPOSITORY, or PR number. Skipping review.");
    return;
  }

  const [owner, repoName] = repo.split("/");
  const commitId = await getCommitSha();
  const shortSha = commitId.slice(0, 9);

  const mainBody = `💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** \`${shortSha}\``;

  const comments = issues.map((i) => ({
    path: i.path,
    line: i.line,
    side: "RIGHT" as const,
    body: `**${i.severity}** ${i.title}\n\n${i.body}`,
  }));

  const body = issues.length > 0 ? mainBody : `${mainBody}\n\nNo critical issues found. ✅`;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commit_id: commitId,
        body,
        event: "COMMENT",
        comments,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${err}`);
  }
  console.log(`Posted review with ${issues.length} line comment(s)`);
}

async function postCodexReviewWithFallback(rawBody: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.GITHUB_EVENT_PATH
    ? (JSON.parse(await Bun.file(process.env.GITHUB_EVENT_PATH).text()) as { pull_request?: { number?: number } })
        .pull_request?.number
    : null;

  if (!token || !repo || !prNumber) {
    console.error("Missing GITHUB_TOKEN, GITHUB_REPOSITORY, or PR number. Skipping.");
    return;
  }

  const [owner, repoName] = repo.split("/");
  const commitId = await getCommitSha();
  const shortSha = commitId.slice(0, 9);

  const body = `💡 Codex Review

Here are some automated review suggestions for this pull request.

**Reviewed commit:** \`${shortSha}\`

---

${rawBody}`;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/reviews`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commit_id: commitId,
        body,
        event: "COMMENT",
        comments: [],
      }),
    }
  );
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  console.log("Posted review (fallback, no line comments)");
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("Fetching PR diff...");
  const diff = await getPrDiff();
  console.log(`Diff length: ${diff.length} chars`);

  if (isDryRun) {
    console.log("\n--- Diff preview (first 2000 chars) ---\n");
    console.log(diff.slice(0, 2000));
    if (diff.length > 2000) console.log("\n... (truncated)");
    console.log("\n✓ Dry run complete. Run without --dry-run to call Z.AI (requires Z_AI_API_KEY).");
    return;
  }

  console.log("Sending to Z.AI GLM for review...");
  const rawReview = await getReviewFromGlm(diff);

  const jsonStr = rawReview.match(/\{[\s\S]*\}/)?.[0] ?? rawReview;
  let issues: ReviewIssue[] = [];
  let parseFailed = false;
  try {
    const parsed = JSON.parse(jsonStr) as { issues?: ReviewIssue[] };
    issues = Array.isArray(parsed?.issues) ? parsed.issues : [];
  } catch {
    console.warn("Could not parse LLM JSON, posting raw review in body");
    parseFailed = true;
  }

  if (parseFailed) {
    await postCodexReviewWithFallback(rawReview);
    return;
  }

  console.log(`Found ${issues.length} issue(s)`);
  issues.forEach((i) => console.log(`  - ${i.severity} ${i.path}:${i.line} ${i.title}`));

  console.log("\nPosting review to PR...");
  await postCodexReview(issues);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
