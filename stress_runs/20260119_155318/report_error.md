# Stress Test Failure

```
Traceback (most recent call last):
  File "C:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign\tools\run_stress_test.py", line 167, in main
    step_durations["metrics_artifacts"] = run_step(
                                          ~~~~~~~~^
        logger,
        ^^^^^^^
    ...<9 lines>...
        PROJECT_ROOT,
        ^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign\tools\run_stress_test.py", line 31, in run_step
    raise RuntimeError(f"Step {name} failed with code {result.returncode}")
RuntimeError: Step metrics_artifacts failed with code 1

```
