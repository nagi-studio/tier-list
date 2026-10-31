import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'*.spec.ts',use:{baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',headless:true,viewport:{width:1440,height:1200},launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}},workers:1,reporter:'list'});
