import type { NextAuthOptions, Session } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getPrismaClient } from './prisma';

const prisma = getPrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/sabi/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Mark auth method as google for phone verification flow
      if (account?.provider === 'google' && user.email) {
        try {
          const sabiUser = await prisma.sabiUser.upsert({
            where: { email: user.email },
            update: {
              googleId: user.id,
              name: user.name || '',
              avatarUrl: user.image || undefined,
            },
            create: {
              email: user.email,
              googleId: user.id,
              name: user.name || 'Google User',
              avatarUrl: user.image || undefined,
              emailVerified: true, // Google users are pre-verified
            },
          });

          // Return the Sabi user ID for session
          user.id = sabiUser.id;
        } catch (error) {
          console.error('Error during Google sign-in:', error);
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // After Google sign-in, redirect to phone verification if needed
      if (url.includes('/api/auth/callback/google')) {
        return `${baseUrl}/sabi/verify-phone`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },

    async session({ session, user }) {
      // Add Sabi-specific user data to session
      if (session.user && user) {
        const sabiUser = await prisma.sabiUser.findUnique({
          where: { id: user.id },
        });

        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
          },
        };
      }

      return session;
    },
  },
};

export default NextAuth(authOptions);
