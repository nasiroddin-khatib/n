const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

/**
 * In production, set AWS_SECRET_ID and grant the runtime IAM role
 * secretsmanager:GetSecretValue permission. SecretString must be a JSON
 * object, e.g. {"JWT_SECRET":"...","ADMIN_SIGNUP_KEY":"..."}.
 * Locally, use an untracked .env file. Never commit credentials.
 */
async function loadSecrets() {
  const secretId = process.env.AWS_SECRET_ID;
  if (!secretId) return;

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "ap-south-1" });
  const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!result.SecretString) throw new Error("AWS Secrets Manager returned an empty secret.");
  const values = JSON.parse(result.SecretString);

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string" && !process.env[key]) process.env[key] = value;
  }
}

module.exports = { loadSecrets };
