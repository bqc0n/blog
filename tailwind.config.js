/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './docs/index.md',
        './docs/**/*.md',
        './.vitepress/**/*.{js,ts,vue}'
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    important: true,
}
