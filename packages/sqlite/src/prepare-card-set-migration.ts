import {createRootLogger, resolveLogConfigFromEnv} from "@tomekin/core";

import {prepareLegacyDatabaseForCardSetMigration} from "./migrations";

if (import.meta.main) {
    const log = createRootLogger(resolveLogConfigFromEnv(process.env));
    prepareLegacyDatabaseForCardSetMigration(undefined, {log}, {
        stdout: {write: (message) => process.stdout.write(message)},
    });
}
