# Developer docs site — VitePress build served by Caddy.
#
# Build context: src/clients  (NOT the repo root, and NOT apps/developer-docs).
#
#   docker build -f src/clients/apps/developer-docs/Dockerfile -t ets-developer-docs:dev src/clients
#
# apps/developer-docs alone is no longer sufficient: the build needs the workspace
# lockfile. The repository root would work but would ship the entire .NET tree
# to the daemon and let any C# commit invalidate this image's cache, so
# src/clients is the minimal sufficient context. It needs src/clients/.dockerignore,
# because the repository-root .dockerignore does not apply to a non-root context.

# ---------------------------------------------------------------------------
# Stage 1 — dependency fetch
#
# `pnpm fetch` populates the virtual store from the lockfile alone, so this
# layer is invalidated only by a dependency change, never by content edits.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /clients

# git is required by VitePress for `lastUpdated` git timestamps.
RUN apk add --no-cache git

# Activates the pnpm version pinned by "packageManager" in the workspace root.
RUN corepack enable pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN pnpm fetch

# ---------------------------------------------------------------------------
# Stage 2 — build
# ---------------------------------------------------------------------------
FROM deps AS build
COPY . .

# The trailing "..." selects apps/developer-docs plus its workspace dependencies, so the
# other apps and their toolchains are never linked.
RUN pnpm install --frozen-lockfile --offline --filter @ets/app-developer-docs...

# VitePress reads git timestamps for `lastUpdated`, and the build context
# excludes .git, so synthesise a single commit — every page then shows the
# build time. Unchanged behaviour: the previous narrow context had no .git either.
RUN if [ ! -d .git ]; then \
        git init -q && \
        git config user.email "docker@build.local" && \
        git config user.name "Docker Build" && \
        git add -A && \
        git commit -qm "Build snapshot"; \
    fi

RUN pnpm --filter @ets/app-developer-docs build

# ---------------------------------------------------------------------------
# Stage 3 — serve
# ---------------------------------------------------------------------------
FROM caddy:2-alpine AS http-server

COPY --from=build /clients/apps/developer-docs/docs/.vitepress/dist /usr/share/caddy
COPY apps/developer-docs/Caddyfile /etc/caddy/Caddyfile

# Document the port the server listens on
EXPOSE 80

# Caddy will automatically start with the Caddyfile configuration
