import { integrationsClient } from "@/client-lib/shared";

interface RunActionParams {
  actionId: string;
  accountId: string;
  input?: unknown;
}

/**
 * Run an action on an integration.
 * This function can only be used client side, not server side.
 * @param actionParams.actionId - The id of the action to run - the name of the tool that you have tested, if you don't know the action id check which tools are available to you first and test the tool before using this function.
 * @param actionParams.accountId - The id of the account to run the action on.
 * @param actionParams.input - optional, depending on the tested tool input schema / configured props - The input to pass to the action.
 * @returns The response from the action
 */
export async function runIntegrationAction<ResponseType>(actionParams: RunActionParams): Promise<ResponseType> {
  const { accountId, ...rest } = actionParams;
  return integrationsClient
    .post<ResponseType>(`/integrations/accounts/${accountId}/execute`, rest)
    .then((res) => res.data);
}
