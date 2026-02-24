# AWS Quiz Application - Mirai Labs

A modern, production-ready web application for AWS certification practice. Built with Next.js, React, TypeScript, and Tailwind CSS.

## Migration Summary

This application has been converted from a Streamlit Python application to a full-stack Next.js application while retaining **100% of the original functionality**.

### What Changed
- **Platform**: Streamlit → Next.js 16 with React 19
- **Backend**: Python scripts → Node.js API routes
- **Frontend**: Streamlit UI → React components with Tailwind CSS
- **Styling**: Streamlit CSS → Tailwind CSS with design tokens
- **Data Storage**: File-based JSON → File-based JSON (same format)

### What Stayed the Same
- All quiz questions and scoring logic
- Question database structure
- Result persistence and analytics
- Markdown question import functionality
- Multi-answer question support
- Complete feature parity

## Features

### Quiz Module
- 40-question randomized AWS certification quizzes
- Support for single-answer and multi-answer questions
- Real-time progress tracking
- Instant scoring with pass/fail determination (70% threshold)
- Detailed answer review with correct/incorrect highlights

### Results Module
- View all test history with scores and percentages
- Detailed performance analytics
- Review incorrect answers for each test
- Track improvement over time
- Pass rate statistics

### Aggregator Module
- Upload markdown files with quiz questions
- Automatic question parsing and validation
- Support for questions with A-E multiple choice options
- Single and multi-answer question support
- Preview questions before uploading
- Append to existing question database

### Design Features
- Professional dark theme with sky blue accents (Mirai Labs branding)
- Responsive design (mobile-first)
- Smooth animations and transitions
- Accessibility-focused (semantic HTML, ARIA attributes)
- Progress indicators and real-time feedback

## Project Structure

```
aws-quiz/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home/landing page
│   ├── globals.css             # Global styles and design tokens
│   ├── quiz/
│   │   ├── page.tsx            # Quiz main page with state management
│   │   └── complete/           # Results completion page
│   │       └── page.tsx
│   ├── results/
│   │   └── page.tsx            # Results history and analytics
│   ├── aggregator/
│   │   └── page.tsx            # File upload and question aggregator
│   └── api/
│       ├── questions/
│       │   └── route.ts        # Question CRUD endpoints
│       ├── results/
│       │   └── route.ts        # Results persistence endpoints
│       └── upload/
│           └── route.ts        # File upload handler
├── components/
│   ├── header.tsx              # Navigation header
│   ├── quiz-start.tsx          # Quiz initialization form
│   └── quiz-question.tsx       # Question card component
├── lib/
│   └── quiz-utils.ts           # Utility functions and types
├── public/
│   ├── data/
│   │   └── questions_db.json   # Question database
│   ├── results/                # Quiz result files (generated)
│   └── uploads/                # Uploaded markdown files (generated)
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
└── next.config.js              # Next.js config
```

## Data Structure

### Question Format
```json
{
  "question": "What is the name of AWS web management interface?",
  "options": [
    { "letter": "A", "text": "AWS CLI" },
    { "letter": "B", "text": "AWS Management Console" }
  ],
  "correct_answer": "B"
}
```

### Multi-Answer Question
```json
{
  "question": "Choose two correct options",
  "options": [
    { "letter": "A", "text": "Option A" },
    { "letter": "B", "text": "Option B" }
  ],
  "correct_answer": ["A", "B"]
}
```

### Result Format
```json
{
  "name": "John Doe",
  "date": "2024-02-23",
  "score": 28,
  "total": 40,
  "percentage": 70,
  "wrong_questions": []
}
```

## Installation & Running

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Questions
- `GET /api/questions` - Fetch all questions
- `POST /api/questions` - Save questions (used by aggregator)

### Results
- `GET /api/results` - Fetch all test results
- `POST /api/results` - Save test result

### Upload
- `POST /api/upload` - Upload markdown files

## Markdown Question Format

Questions should follow this markdown structure:

```markdown
1. Question text here?
- A. Option A
- B. Option B
- C. Option C
- D. Option D

<details>
<summary>Answer</summary>
Correct answer: A
</details>

2. Multi-answer question?
- A. Option A
- B. Option B
- C. Option C

<details>
<summary>Answer</summary>
Correct answer: A, C
</details>
```

## Configuration

### Theme Customization

Edit `app/globals.css` to customize colors:

```css
:root {
  --primary: #38bdf8;           /* Sky blue */
  --primary-dark: #0284c7;
  --background: #020617;         /* Dark background */
  --surface: #0f172a;            /* Card background */
  --text-primary: #e2e8f0;      /* Main text */
  --text-secondary: #94a3b8;    /* Secondary text */
}
```

## Environment Variables

No environment variables required for basic functionality. The application works entirely with file-based storage in the `public/` directory.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Next.js 16 with React Compiler for optimized builds
- Client-side state management for smooth quiz experience
- File-based storage with efficient JSON parsing
- CSS-in-JS with Tailwind for minimal bundle size
- Responsive images and lazy loading ready

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Self-hosted
```bash
npm run build
npm start
```

Note: Ensure the `public/data`, `public/results`, and `public/uploads` directories are writable by the Node.js process.

## File Storage

All data is stored as JSON files in the `public/` directory:

- `public/data/questions_db.json` - Question database
- `public/results/test_*.json` - Individual test results
- `public/uploads/*.md` - Uploaded markdown question files

For production deployments, consider migrating to a database (PostgreSQL, MongoDB, etc.) or cloud storage (S3, etc.).

## Troubleshooting

### Questions not loading
1. Verify `public/data/questions_db.json` exists
2. Check file permissions
3. Ensure JSON format is valid

### Results not saving
1. Verify `public/results/` directory exists and is writable
2. Check browser console for API errors
3. Ensure sufficient disk space

### Styling issues
1. Clear `.next/` cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. Restart dev server: `npm run dev`

## Future Enhancements

Potential improvements for future versions:

- Database integration (PostgreSQL/MongoDB)
- User authentication system
- Leaderboard and progress tracking
- Question difficulty levels
- Performance analytics dashboard
- Question editing interface
- Bulk import from CSV/Excel
- Question recommendations based on weaknesses
- Timed mode for realistic exam practice

## Maintenance

### Adding New Questions
1. Navigate to `/aggregator`
2. Upload markdown files with question format
3. Preview and upload to database
4. Questions immediately available in quizzes

### Updating Styling
1. Edit `app/globals.css` for global styles
2. Modify `tailwind.config.ts` for Tailwind configuration
3. Update color tokens in CSS variables

### Performance Optimization
1. Monitor build size: `npm run build`
2. Check Core Web Vitals in browser DevTools
3. Review Next.js analytics for slow pages

## License

This project is part of Mirai Labs AWS Training Program.

## Support

For issues, questions, or feature requests, contact the development team.

## Version History

### v1.0.0 (2024)
- Initial release
- Converted from Streamlit to Next.js
- Full feature parity with original
- Professional UI redesign
- Production-ready code

---

**Built with Next.js 16, React 19, and Tailwind CSS**
**Powered by Mirai Labs**
