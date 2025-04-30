const crypto = require('crypto');

const {auth} = require("@clerk/express")
const { getAuth } = require("@clerk/express");
const JWKS_URL = 'https://coherent-shiner-22.clerk.accounts.dev/.well-known/jwks.json';
const AUDIENCE = 'http://localhost:3000';
const ISSUER = 'https://coherent-shiner-22.clerk.accounts.dev';

let JWKS;

async function isAuthenticated(req, res, next) {
  console.log("got here")
  const { createRemoteJWKSet, jwtVerify } = await import('jose');
  const { sessionClaims } = getAuth(req);
  console.log(sessionClaims)
  if (!JWKS) {
    JWKS = createRemoteJWKSet(new URL(JWKS_URL));
  }

  const token =
    req.headers.authorization?.split(' ')[1] || req.cookies?.__session;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      clockTolerance: 100,  // Allow small time difference
    });

    // Assuming Clerk includes the email in the payload
    console.log(payload )
    const userEmail = payload.userEmail || payload.email || payload.emailAddresses?.[0]?.emailAddress;
    
    if (userEmail) {
      console.log('User Email:', userEmail);
    } else {
      console.error('Email not found in payload');
    }

    req.user = payload;  // Attach the entire payload to the request
    req.user.email = userEmail;  // Attach the email to the request user object
    next();
  } catch (error) {
    console.error('Authentication failed:', error);
    return res.status(401).json({ error: 'Session doesn’t exist or is invalid' });
  }
}

module.exports = isAuthenticated;
