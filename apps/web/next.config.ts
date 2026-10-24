import type { NextConfig } from "next";
import { readApplicationEnvironment } from "./lib/env";

readApplicationEnvironment();

const config: NextConfig = { poweredByHeader: false };
export default config;
