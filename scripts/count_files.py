import os

folder_path = "C:\\Users\\suhasnidgundi\\Projects\\oracle-personal-docs\\data"

file_count = 0

for root, dirs, files in os.walk(folder_path):
    file_count += len(files)

print(f"Total files inside '{folder_path}': {file_count}")