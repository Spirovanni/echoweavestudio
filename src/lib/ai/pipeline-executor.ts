/**
 * AI Pipeline Executor
 *
 * Manages execution of multi-step AI generation pipelines with state management,
 * pause/resume capabilities, and result persistence.
 */

import { getAIProvider } from "./index";
import type {
  PipelineDefinition,
  PipelineState,
  PipelineResult,
  PipelineExecutionOptions,
  StepInput,
  StepOutput,
  PipelineStatus,
} from "./pipeline-types";

/**
 * Execute a pipeline from start to finish
 */
export class PipelineExecutor {
  private definition: PipelineDefinition;
  private state: PipelineState;
  private options: PipelineExecutionOptions;
  private startTime: number;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;

  constructor(
    definition: PipelineDefinition,
    options: PipelineExecutionOptions
  ) {
    this.definition = definition;
    this.options = options;
    this.startTime = Date.now();

    // Initialize state
    this.state = {
      executionId: this.generateExecutionId(),
      pipelineId: definition.id,
      status: "pending",
      currentStepIndex: 0,
      completedSteps: [],
      stepStatuses: {},
      initialInput: options.input,
      userId: options.userId,
      projectId: options.projectId,
      startedAt: new Date().toISOString(),
    };

    // Initialize step statuses
    for (const step of definition.steps) {
      this.state.stepStatuses[step.id] = "pending";
    }
  }

  /**
   * Re-hydrate a PipelineExecutor from an existing state
   */
  static fromState(
    state: PipelineState,
    definition: PipelineDefinition,
    options: PipelineExecutionOptions
  ): PipelineExecutor {
    // We pass dummy input since it will be overwritten by state
    const executor = new PipelineExecutor(definition, options);
    executor.state = JSON.parse(JSON.stringify(state)); // Deep copy to avoid reference issues
    
    // If we're paused, we must set the internal boolean
    if (executor.state.status === "paused") {
      executor.isPaused = true;
    }
    
    return executor;
  }

  /**
   * Execute the pipeline
   */
  async execute(): Promise<PipelineResult> {
    this.updateStatus("running");

    try {
      // Execute steps sequentially, starting from currentStepIndex
      for (let i = this.state.currentStepIndex; i < this.definition.steps.length; i++) {
        // If we just resumed, clear the paused flag at the start of loop
        if (this.isPaused && this.state.status === "running") {
           this.isPaused = false;
        }

        // Check for pause or cancellation
        if (this.isPaused) {
          this.updateStatus("paused");
          throw new Error("Pipeline paused");
        }

        if (this.isCancelled) {
          this.updateStatus("cancelled");
          throw new Error("Pipeline cancelled");
        }

        const step = this.definition.steps[i];
        this.state.currentStepIndex = i;

        // Check if step should run
        const stepInput = this.buildStepInput(step);
        if (step.shouldRun && !step.shouldRun(stepInput)) {
          this.state.stepStatuses[step.id] = "skipped";
          continue;
        }

        // Execute step
        this.state.stepStatuses[step.id] = "running";
        const output = await this.executeStep(step, stepInput);

        // Store result
        this.state.completedSteps.push(output);
        this.state.stepStatuses[step.id] = "completed";

        // Callback
        if (this.options.onStepComplete) {
          this.options.onStepComplete(step, output);
        }
      }

      // Pipeline completed successfully
      this.updateStatus("completed");
      this.state.completedAt = new Date().toISOString();

      return this.buildResult();
    } catch (error) {
      // Pipeline failed
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      this.state.error = {
        message: errorMessage,
        stepId: this.definition.steps[this.state.currentStepIndex]?.id || "unknown",
        timestamp: new Date().toISOString(),
      };

      // Only mark as failed if not paused or cancelled
      if (!this.isPaused && !this.isCancelled) {
        this.updateStatus("failed");
      }

      return this.buildResult();
    }
  }

  /**
   * Pause the pipeline execution
   */
  pause(): void {
    if (this.state.status === "running") {
      this.isPaused = true;
      this.state.pausedAt = new Date().toISOString();
    }
  }

  /**
   * Resume a paused pipeline
   */
  async resume(): Promise<PipelineResult> {
    if (this.state.status === "paused") {
      this.isPaused = false;
      this.state.pausedAt = undefined;
      // Start the execute loop, picking up where it left off
      return this.execute();
    }
    throw new Error("Pipeline is not paused");
  }

  /**
   * Cancel the pipeline execution
   */
  cancel(): void {
    this.isCancelled = true;
  }

  /**
   * Get current pipeline state
   */
  getState(): PipelineState {
    return { ...this.state };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: any,
    input: StepInput
  ): Promise<StepOutput> {
    const provider = getAIProvider();

    // Build prompt using step's builder
    const userPrompt = step.buildPrompt(input);

    // Generate with AI
    const result = await provider.generate({
      messages: [{ role: "user", content: userPrompt }],
      system: step.systemPrompt,
      temperature: step.options?.temperature,
      maxTokens: step.options?.maxTokens,
      model: step.options?.model,
    });

    // Try to parse structured output
    let structured;
    try {
      structured = JSON.parse(result.text);
    } catch {
      structured = undefined;
    }

    return {
      stepId: step.id,
      text: result.text,
      structured,
      model: result.model,
      usage: result.usage,
      metadata: {
        stepName: step.name,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Build input for a step based on previous outputs
   */
  private buildStepInput(step: any): StepInput {
    return {
      prompt: this.state.initialInput.prompt,
      context: {
        ...this.state.initialInput.context,
        currentStep: step.name,
        stepIndex: this.state.currentStepIndex,
      },
      previousOutputs: this.state.completedSteps,
      params: this.state.initialInput.params,
    };
  }

  /**
   * Update pipeline status
   */
  private updateStatus(status: PipelineStatus): void {
    this.state.status = status;
    if (this.options.onStatusChange) {
      this.options.onStatusChange(status);
    }
  }

  /**
   * Build final result
   */
  private buildResult(): PipelineResult {
    const durationMs = Date.now() - this.startTime;
    const totalTokens = this.state.completedSteps.reduce(
      (sum, output) => sum + output.usage.totalTokens,
      0
    );

    return {
      executionId: this.state.executionId,
      status: this.state.status,
      outputs: this.state.completedSteps,
      finalOutput: this.state.completedSteps[this.state.completedSteps.length - 1]?.text,
      durationMs,
      totalTokens,
      error: this.state.error?.message,
    };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Helper to execute a pipeline with simplified API
 */
export async function executePipeline(
  definition: PipelineDefinition,
  options: PipelineExecutionOptions
): Promise<PipelineResult> {
  const executor = new PipelineExecutor(definition, options);
  return executor.execute();
}
