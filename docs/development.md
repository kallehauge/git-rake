# Development

**HEADS UP**: This is by no means fully documented, but it's a pretty simple project. So if you're accustomed to working with JS/TS, then you should be up and running in no time <3

## How to install locally

```bash
# Install dependencies
npm install

# Development mode
# Using "dev", the app enables React DevTools integration and profiling.
When DEV=true is set, the app enables React DevTools integration and profiling.
npm run dev
npx react-devtools

# Run development mode against different Git repo
npm run dev -- --cwd /path/to/repo

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run typecheck`
6. Submit a pull request
