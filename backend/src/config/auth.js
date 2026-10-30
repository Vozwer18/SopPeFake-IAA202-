const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
module.exports = { secret, cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' } };
