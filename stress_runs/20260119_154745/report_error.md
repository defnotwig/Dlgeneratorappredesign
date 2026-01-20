# Stress Test Failure

```
Traceback (most recent call last):
  File "C:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign\tools\run_stress_test.py", line 88, in main
    step_durations["preprocess"] = run_step(
                                   ~~~~~~~~^
        logger,
        ^^^^^^^
    ...<7 lines>...
        PROJECT_ROOT,
        ^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign\tools\run_stress_test.py", line 31, in run_step
    raise RuntimeError(f"Step {name} failed with code {result.returncode}")
RuntimeError: Step preprocess failed with code 1

```
