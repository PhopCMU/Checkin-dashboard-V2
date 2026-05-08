# Code Review: Performance

## When to use
- PRs touching lists, charts, maps, heavy exports, routing, data fetching

## Checklist
- [ ] Avoid unnecessary re-renders (lift state appropriately)
- [ ] Large lists: consider pagination/virtualization if needed
- [ ] Chart/Map components: avoid re-creating objects every render (options, layers)
- [ ] Exports (PDF/Excel): avoid blocking UI for large datasets (chunking / web worker if needed)
- [ ] Network: no duplicate requests; handle loading states and errors

## Pitfalls
- Creating new `center={[..]}` arrays each render for maps causing resets
- Generating huge PDFs/Excel on main thread without feedback

## Update notes
- (append new learnings here)
