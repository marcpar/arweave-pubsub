import { NewConnection } from "../../Libraries/Near/connection";
import { ACCOUNT_POSTFIX } from "../../Libraries/Near/constants";


function IsAccountIDValid(accountId: string): boolean {
    if (accountId.length < 2 || accountId.length > 64) {
        return false;
    }

    if (!accountId.endsWith(ACCOUNT_POSTFIX)) {
        return false;
    }

    let _accountId = accountId.replaceAll(ACCOUNT_POSTFIX, '');

    let pattern = /^(([a-z\d]+[-_])*[a-z\d]+)$/;
    return pattern.test(_accountId);
}

async function IsAccountIDAvailableCallback(accountID: string, callback: (isAvailable: boolean) => void) {
    let connection = await NewConnection();
    connection.account(accountID).then(async (account) => {
        try {
            await account.state();
            callback(false);
        } catch (e) {
            callback(true);
            return;
        }
    }, (e) => {
        console.error(e);
    });

}

export {
    IsAccountIDValid,
    IsAccountIDAvailableCallback
}