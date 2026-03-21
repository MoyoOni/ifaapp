#!/usr/bin/env python3
"""
Fix package-lock.json: hoist @sentry/node's nested transitive packages to root.
This fixes Docker builds where @opentelemetry/* can't be found at runtime.
"""
import json

with open('package-lock.json') as f:
    lock = json.load(f)

packages = lock.get('packages', {})

# Find all packages nested inside @sentry/node/node_modules/ that are NOT at root
sentry_nested_prefix = 'node_modules/@sentry/node/node_modules/'
added = []

for k, v in list(packages.items()):
    if k.startswith(sentry_nested_prefix) and k.count('node_modules') == 2:
        pkg_name = k[len(sentry_nested_prefix):]
        root_key = f'node_modules/{pkg_name}'
        if root_key not in packages:
            entry = {kk: vv for kk, vv in v.items() if kk != 'link'}
            packages[root_key] = entry
            added.append(pkg_name)
            print(f'  Hoisted: {pkg_name} @ {v.get("version", "?")}')

# Also fix @fastify/otel nested packages (one level deeper)
fastify_prefix = 'node_modules/@sentry/node/node_modules/@fastify/otel/node_modules/'
for k, v in list(packages.items()):
    if k.startswith(fastify_prefix):
        pkg_name = k[len(fastify_prefix):]
        # Skip if already at root or at @sentry/node level
        root_key = f'node_modules/{pkg_name}'
        sentry_key = f'{sentry_nested_prefix}{pkg_name}'
        if root_key not in packages and sentry_key not in packages:
            entry = {kk: vv for kk, vv in v.items() if kk != 'link'}
            packages[root_key] = entry
            added.append(f'(fastify) {pkg_name}')
            print(f'  Hoisted: (fastify) {pkg_name} @ {v.get("version", "?")}')

print(f'\nTotal packages hoisted to root: {len(added)}')

with open('package-lock.json', 'w') as f:
    json.dump(lock, f, separators=(',', ':'))

print('package-lock.json updated successfully')
