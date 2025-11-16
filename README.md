# NewsWale - Retro News Portal

A vintage 90s-styled news website built with modern web technologies. NewsWale brings you real-time news with an authentic retro aesthetic.

## Features

- **Real-time News**: Live news feed powered by NewsData.io API
- **90s Retro Design**: Authentic vintage styling with classic newspaper layout
- **Category Filtering**: Browse news by different categories
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Slide Animation**: Featured articles with smooth transitions
- **Bookmark System**: Save articles for later reading
- **Modal Preview**: Full-screen article reading experience

## Tech Stack

- **React 19.2.0** - Frontend framework
- **TypeScript** - Type safety
- **Tailwind CSS 3.4.1** - Styling framework
- **Vite 7.2.2** - Build tool and development server
- **NewsData.io API** - Real-time news data

## Live Demo

🌐 [Visit NewsWale](your-deployment-url-here)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ayushkumarpatel-AKP/newswale.git
cd newswale
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```
Then edit `.env` file and add your NewsData.io API key:
```
VITE_NEWS_API_KEY=your_actual_api_key_here
```

4. Start development server:
```bash
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── NewsWale.tsx      # Main component
├── index.css         # 90s styling and themes
├── main.tsx          # App entry point
└── App.tsx           # App wrapper
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Developer

**Ayush Kumar Patel (A.K.P)**
- 🌍 Based in Raipur, Chhattisgarh
- 💼 [LinkedIn](https://www.linkedin.com/in/ayush-kumar-patel-50276a281/)
- 🐱 [GitHub](https://github.com/ayushkumarpatel-AKP)
- 📸 [Instagram](https://instagram.com/akp07.official)

## Acknowledgments

- NewsData.io for providing the news API
- Google Fonts for vintage typography
- Tailwind CSS for styling framework
- React community for excellent documentation

---

**"Real News, Real Time, Raipur Style!"** 📰
