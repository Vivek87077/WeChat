const allowedOrigins = [
  "https://chatklr.netlify.app",
  "http://localhost:5173",
  process.env.CLIENT_URL, // optional dynamic client URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like Socket.IO polling or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const CHATTU_TOKEN = "chattu-token";

export { corsOptions, CHATTU_TOKEN };
