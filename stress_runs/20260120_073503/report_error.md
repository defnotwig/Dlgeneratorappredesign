# Stress Test Failure

```
Traceback (most recent call last):
  File "C:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign\tools\run_stress_test.py", line 99, in main
    step_durations["generate_dates"] = run_step(
                                       ~~~~~~~~^
        logger,
        ^^^^^^^
    ...<12 lines>...
        PROJECT_ROOT,
        ^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign\tools\run_stress_test.py", line 31, in run_step
    raise RuntimeError(f"Step {name} failed with code {result.returncode}")
RuntimeError: Step generate_dates failed with code 1

```
