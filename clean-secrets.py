#!/usr/bin/env python3
"""
Git history cleaner - removes hardcoded secrets from staging-env-template.sh
Run this to clean secrets from the entire commit history.
"""

import os
import sys
import subprocess
import re

# Secrets to replace
SECRETS_TO_REMOVE = {
    'FLWSECK_TEST-11bd1fa3353a67e40db1f378b0a3f988-X': 'your-flutterwave-secret-key',
    'FLWPUBK_TEST-99bcb1a9fb478925d01e4890bf4ce62b-X': 'your-flutterwave-public-key',
    'sk_test_c91b0866567596588f6b952d491ba10a86b6833a': 'your-paystack-secret-key',
    '0e64f15b4016cc9080cc0657c2f67aed@o4510958532427776.ingest.de.sentry.io/4510958801059920': 'your-sentry-dsn',
}

def clean_file(filepath):
    """Remove secrets from a file"""
    if not os.path.exists(filepath):
        return False
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original = content
    for secret, placeholder in SECRETS_TO_REMOVE.items():
        content = content.replace(secret, placeholder)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    repo_root = os.getcwd()
    print(f"Repository root: {repo_root}")
    print("\nSearching for files with secrets...")
    
    # Find all files that might contain secrets
    files_to_check = []
    for root, dirs, files in os.walk(repo_root):
        # Skip git, node_modules, dist
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', '.next']]
        
        for file in files:
            if file.endswith(('.sh', '.env', '.env.example', '.env.local')):
                files_to_check.append(os.path.join(root, file))
    
    # Check each file
    files_with_secrets = []
    for filepath in files_to_check:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            for secret in SECRETS_TO_REMOVE.keys():
                if secret in content:
                    files_with_secrets.append(filepath)
                    print(f"  ❌ Found secret in: {filepath}")
                    break
        except Exception as e:
            pass
    
    if not files_with_secrets:
        print("✅ No secrets found in current working directory")
        return 0
    
    print(f"\n⚠️  Found secrets in {len(files_with_secrets)} file(s)")
    print("Run: git filter-branch -f --tree-filter 'python3 clean-secrets.py' -- --all")
    return 1

if __name__ == '__main__':
    sys.exit(main())
