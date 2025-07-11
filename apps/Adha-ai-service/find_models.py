import os

def find_files(root_dir, pattern):
    found_files = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if pattern in file:
                found_files.append(os.path.join(root, file))
    return found_files

if __name__ == "__main__":
    root_directory = os.path.dirname(os.path.abspath(__file__))
    token_files = find_files(root_directory, "token_")
    print("Found the following token-related files:")
    for file in token_files:
        print(f"- {file}")
