import { type JSONSchema7 } from "json-schema";

export const fakeJsonShcemaInput: JSONSchema7 = {
  type: "object",
  properties: {
    email: {
      type: "string",
      description: "The sender's email address",
    },
    interest: {
      type: "integer",
      minimum: 1,
      maximum: 5,
      description: "The interest level shown in the email response",
    },
    painPoints: {
      type: "array",
      items: { type: "string" },
      description: "The pain points of the sender",
    },
    goals: {
      type: "array",
      items: { type: "string" },
      description: "The goals of the sender",
    },
    notes: {
      type: "string",
      description: "Suggested notes for closing the deal",
    },
  },
  required: ["email", "interest", "painPoints", "goals", "notes"],
};

export const fakeJsonShcemaOutput = {
  email: "test@test.com",
  interest: 3,
  painPoints: ["Pain point 1", "Pain point 2"],
  goals: ["Goal 1", "Goal 2"],
  notes: "Suggested notes for closing the deal",
};
