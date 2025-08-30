# 🚀 VERCEL SETUP INSTRUCTIONS

## 📋 Prerequisites
- [ ] Vercel account created
- [ ] Supabase project ready
- [ ] All API keys collected

## 🔑 Step 1: Get Supabase Service Role Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **vetify-app**
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)
5. Keep this key secret - never expose in client-side code

## 🚀 Step 2: Create Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `pnpm build`
   - **Output Directory**: .next

## ⚙️ Step 3: Configure Environment Variables
1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add each variable from the `VERCEL_ENV_COPY_PASTE.txt` file
3. **IMPORTANT**: Mark ALL variables for:
   - ✅ Production
   - ✅ Preview
   - ❌ Development (usually not needed)

## 🔧 Step 4: Update Connection Strings
1. Replace `YOUR_SERVICE_ROLE_KEY_HERE` in:
   - `DATABASE_URL`
   - `DIRECT_URL`
2. Replace `YOUR_STRIPE_*_KEY_HERE` with your actual Stripe keys

## 🚀 Step 5: Deploy
1. Commit and push your changes
2. Vercel will automatically deploy
3. Monitor the build process
4. Check for any errors

## ✅ Step 6: Verify Deployment
1. Test your application
2. Check database connections
3. Verify authentication works
4. Test all major features

## 🚨 Troubleshooting
- **Build fails**: Check environment variables
- **Database errors**: Verify connection strings
- **Auth issues**: Check Kinde configuration
- **API errors**: Verify webhook URLs

## 📞 Support
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Your project: Check logs and error messages
