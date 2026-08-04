import os
Import("env")

PROJECT_DIR = env.get("PROJECT_DIR")
file_path = os.path.join(PROJECT_DIR, ".env")

if os.path.exists(file_path):
    print("*** READING .ENV FILE ***")
    with open(file_path, 'r') as file:
        lines = file.readlines()
        for line in lines:
            line = line.strip()

            # Skip empty lines or comments
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip()

            if val.isdigit():
                flag = f"-D {key}={val}"
            else:
                flag = f"-D {key}={env.StringifyMacro(val)}"

            env.Append(BUILD_FLAGS=[flag])
            print(f"[ENV] Added macro: {flag}")
else:
    print(f"*** WARNING: No .env file found at {file_path} ***")