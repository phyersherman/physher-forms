# Course Import JSON Reference Guide

This document shows the EXACT structure expected by the import function.

## Root Structure
```json
{
  "_instructions": { /* optional - ignored during import */ },
  "courses": [ /* REQUIRED - array of courses to import */ ]
}
```

## Course Object
```json
{
  "title": "Course Name",           // REQUIRED - string
  "description": "Optional text",   // OPTIONAL - string
  "chapters": [ /* REQUIRED - at least 1 chapter */ ]
}
```

## Chapter Object
```json
{
  "title": "Chapter Name",          // REQUIRED - string
  "order": 1,                       // REQUIRED - sequential number (1, 2, 3...)
  "modules": [ /* REQUIRED - at least 1 module */ ]
}
```

## Module Object
```json
{
  "title": "Module/Lesson Name",    // REQUIRED - string
  "order": 1,                       // REQUIRED - sequential number (1, 2, 3...)
  "blocks": [ /* REQUIRED - at least 1 block */ ]
}
```

## Block Object (the actual content)
```json
{
  "type": "text",                   // REQUIRED - one of: text, image, video, quote, button, quiz
  "order": 1,                       // REQUIRED - sequential number (1, 2, 3...)
  "content": "Block content here",  // REQUIRED for most types - varies by type
  "config": { /* OPTIONAL - varies by type */ }
}
```

---

## Block Types & Configurations

### TEXT Block
```json
{
  "type": "text",
  "order": 1,
  "content": "Any text content goes here. Can be multiple paragraphs."
}
```
- `content`: Plain text string
- `config`: Not used

### IMAGE Block
```json
{
  "type": "image",
  "order": 2,
  "content": "https://example.com/image.jpg",
  "config": {
    "width": 800,
    "height": 600,
    "alt": "Image description"
  }
}
```
- `content`: URL to the image (must include https://)
- `config.width`: Pixel width (number)
- `config.height`: Pixel height (number)
- `config.alt`: Alt text for accessibility (string)

### VIDEO Block
```json
{
  "type": "video",
  "order": 3,
  "content": "https://example.com/video.mp4",
  "config": {
    "width": 800,
    "height": 450,
    "autoplay": false
  }
}
```
- `content`: URL to video file
- `config.width`: Player width (number)
- `config.height`: Player height (number)
- `config.autoplay`: true/false

### QUOTE Block
```json
{
  "type": "quote",
  "order": 4,
  "content": "The actual quote text",
  "config": {
    "author": "Quote Author",
    "citation": "Source or attribution"
  }
}
```
- `content`: The quote text
- `config.author`: Person who said it
- `config.citation`: Source reference

### BUTTON Block
```json
{
  "type": "button",
  "order": 5,
  "content": "Click Here",
  "config": {
    "url": "https://example.com/page",
    "color": "primary",
    "openInNewTab": true
  }
}
```
- `content`: Button label/text
- `config.url`: Link destination
- `config.color`: Button color (string)
- `config.openInNewTab`: true/false

### QUIZ Block
```json
{
  "type": "quiz",
  "order": 6,
  "config": {
    "questions": [
      {
        "question": "What is 2+2?",
        "type": "multiple_choice",
        "options": [
          "3",
          "4",
          "5"
        ],
        "correct": 1
      }
    ],
    "passingScore": 70,
    "attemptsAllowed": 3,
    "feedback": "Great job!"
  }
}
```
- `content`: Not used for quiz blocks
- `config.questions`: Array of question objects
  - `question`: Question text
  - `type`: "multiple_choice" or "short_answer"
  - `options`: Array of answer choices (for multiple choice)
  - `correct`: Index of correct answer (0-based, for multiple choice)
  - `answer`: Correct text (for short answer)
- `config.passingScore`: Minimum score (0-100)
- `config.attemptsAllowed`: Number of attempts allowed
- `config.feedback`: Optional feedback message

---

## Complete Minimal Example

Here's the MINIMUM JSON needed to import:

```json
{
  "courses": [
    {
      "title": "My Course",
      "chapters": [
        {
          "title": "Chapter 1",
          "order": 1,
          "modules": [
            {
              "title": "Lesson 1",
              "order": 1,
              "blocks": [
                {
                  "type": "text",
                  "order": 1,
                  "content": "Hello world"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Critical Rules

1. **Order is sequential**: If you have 2 chapters, use `order: 1` and `order: 2`. Don't use `order: 1` and `order: 3`.

2. **No gaps**: Each chapter/module must have its order numbers continuous from 1.

3. **Required elements**:
   - Every course MUST have at least 1 chapter
   - Every chapter MUST have at least 1 module
   - Every module MUST have at least 1 block

4. **Content depends on type**:
   - `text`: content must be text string
   - `image`, `video`: content must be URL
   - `quote`: content is quote text, config has author/citation
   - `button`: content is label, config has URL
   - `quiz`: no content, config has questions

5. **URLs must be complete**: Always include `https://` in URLs

---

## Debugging Import Failures

If your course isn't importing completely:

1. **Check chapter order**: Make sure chapters are `order: 1, 2, 3...` not random numbers
2. **Check module order**: Each chapter's modules should be `order: 1, 2, 3...`
3. **Check block order**: Each module's blocks should be `order: 1, 2, 3...`
4. **Validate JSON**: Use jsonlint.com to ensure JSON is valid
5. **Download the template**: The template file shows working examples

---

## Helpful Tips

- Download the template from the import page - it has working examples
- Start with the minimal example above and expand from there
- Test with 1 course → 1 chapter → 1 module → 1 block first
- Then add more chapters/modules once basic import works
