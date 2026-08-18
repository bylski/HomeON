import os
Import("env")

PROJECT_DIR = env.get("PROJECT_DIR")
SHARED_ENV_FILENAME = '.env.shared'

def find_shared_env_path(current_dir: str):
    current_dir_with_env_file = os.path.join(current_dir, SHARED_ENV_FILENAME)
    parent_dir = os.path.dirname(current_dir)

    if (os.path.exists(current_dir_with_env_file)):
        return current_dir_with_env_file
    
    if (parent_dir == current_dir): 
        raise Exception("Reached root")
    
    return find_shared_env_path(parent_dir)


def load_envs(file_paths: list[str]):
    for file_path in file_paths:
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

firmware_env_file_path = os.path.join(PROJECT_DIR, ".env")
shared_env_path =  find_shared_env_path(PROJECT_DIR)
env_file_paths = [firmware_env_file_path, shared_env_path]

load_envs(env_file_paths)
