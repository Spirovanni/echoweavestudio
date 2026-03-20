import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAIProvider, aiStreamToReadableStream } from "./index";
import type { AIProvider, AIStreamChunk } from "./types";

// Mock the provider modules with proper classes
vi.mock("./anthropic-provider", () => ({
  AnthropicProvider: class MockAnthropicProvider {
    name = "anthropic" as const;
    _apiKey: string | undefined;
    constructor(apiKey?: string) {
      this._apiKey = apiKey;
    }
    generate = vi.fn().mockResolvedValue({
      text: "Generated text",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      model: "claude-sonnet-4-5-20250929",
      finishReason: "end_turn",
    });
    stream = vi.fn();
  },
}));

vi.mock("./openai-provider", () => ({
  OpenAIProvider: class MockOpenAIProvider {
    name = "openai" as const;
    _apiKey: string | undefined;
    constructor(apiKey?: string) {
      this._apiKey = apiKey;
    }
    generate = vi.fn().mockResolvedValue({
      text: "Generated text",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      model: "gpt-4o",
      finishReason: "stop",
    });
    stream = vi.fn();
  },
}));

describe("AI Provider Factory", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an Anthropic provider", () => {
    const provider = createAIProvider("anthropic");
    expect(provider.name).toBe("anthropic");
  });

  it("creates an OpenAI provider", () => {
    const provider = createAIProvider("openai");
    expect(provider.name).toBe("openai");
  });

  it("passes custom API key to provider", () => {
    const provider = createAIProvider("anthropic", "custom-key") as any;
    expect(provider._apiKey).toBe("custom-key");
  });

  it("generates text with the provider", async () => {
    const provider = createAIProvider("anthropic");
    const result = await provider.generate({
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result.text).toBe("Generated text");
    expect(result.usage.totalTokens).toBe(30);
    expect(result.model).toBe("claude-sonnet-4-5-20250929");
    expect(result.finishReason).toBe("end_turn");
  });
});

describe("aiStreamToReadableStream", () => {
  it("converts async iterable to ReadableStream", async () => {
    async function* mockStream(): AsyncIterable<AIStreamChunk> {
      yield { text: "Hello " };
      yield { text: "world" };
      yield {
        text: "!",
        usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        finishReason: "end_turn",
      };
    }

    const stream = aiStreamToReadableStream(mockStream());
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let fullText = "";
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        fullText += decoder.decode(result.value);
      }
    }

    expect(fullText).toBe("Hello world!");
  });

  it("handles empty chunks gracefully", async () => {
    async function* mockStream(): AsyncIterable<AIStreamChunk> {
      yield { text: "" };
      yield { text: "content" };
    }

    const stream = aiStreamToReadableStream(mockStream());
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let fullText = "";
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        fullText += decoder.decode(result.value);
      }
    }

    expect(fullText).toBe("content");
  });
});
