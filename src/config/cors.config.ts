import cors from "cors";

const corsOptions = {
  origin: [
    "*"
  ],
  methods: ["*"],
  allowedHeaders: ["*"],
};

export default cors(corsOptions);
