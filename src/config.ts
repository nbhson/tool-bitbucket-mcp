import axios from "axios";
import https from "https";

// Bitbucket Server credentials and URL
const BITBUCKET_URL = process.env.BITBUCKET_URL;
const BITBUCKET_TOKEN = process.env.BITBUCKET_TOKEN;

if (!BITBUCKET_URL || !BITBUCKET_TOKEN) {
  console.error("Missing BITBUCKET_URL or BITBUCKET_TOKEN environment variables");
  process.exit(1);
}

// Remove trailing slash from URL if present
const baseUrl = BITBUCKET_URL.replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: baseUrl,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: {
    Authorization: `Bearer ${BITBUCKET_TOKEN}`,
    Accept: "application/json",
  },
});