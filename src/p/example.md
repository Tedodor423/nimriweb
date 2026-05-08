---
title: Example Presentation
description: A starter reveal.js deck for t.nimrichtr.cz/p/.
transition: slide
---

# Example Presentation

This deck lives in `src/p/example.md`.

---

## Horizontal Slides

- Separate slides with `---`
- Use normal Markdown
- The stock reveal.js theme is applied automatically

---

## Vertical Flow

Slides progress vertically by default.

--

### Vertical Child

This is the next slide below the previous one.

--

### Another Child

Good for subtopics or detail.

---

## Local Assets

Put images or files next to the deck inside `src/p/`.

Example link syntax:

[Notes](./notes.pdf)

[Download the presentation in PDF](/p/example/?print-pdf)


Example image syntax:

`![Diagram](./diagram.png)`

---

## Front Matter

You can set:

- `title`
- `description`
- `transition`

Then rebuild and open `/p/example/`.
