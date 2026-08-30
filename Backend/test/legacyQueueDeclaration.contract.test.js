import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";


// =====================================
// FEATURE 3.8B
// LEGACY QUEUE DECLARATION PATH
//
// The old queue-declaration mutation path
// must not remain an independent authority.
//
// Supported declaration flow:
//
// Officials Screen
//      ↓
// saveDeclaredWeight
//      ↓
// saveDeclaration
//      ↓
// authoritative LiveCompetition state
//
// The legacy updateQueueDeclaration service
// must therefore not remain as a second
// CompetitionEntry mutation implementation.
// =====================================


const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);

const backendRoot =
    path.resolve(
        __dirname,
        ".."
    );

const legacyServicePath =
    path.join(
        backendRoot,
        "services",
        "liveCompetition",
        "updateQueueDeclaration.js"
    );

const liveCompetitionControllerPath =
    path.join(
        backendRoot,
        "controllers",
        "liveCompetitionController.js"
    );

const liveCompetitionRoutesPath =
    path.join(
        backendRoot,
        "routes",
        "liveCompetitionRoutes.js"
    );


// =====================================
// TEST 1
// =====================================

test(
    "Feature 3.8B - legacy queue declaration service is retired",
    () => {

        assert.equal(

            fs.existsSync(
                legacyServicePath
            ),

            false,

            "updateQueueDeclaration.js must not remain as an independent declaration mutation service."

        );

    }
);


// =====================================
// TEST 2
// =====================================

test(
    "Feature 3.8B - legacy queue declaration controller is retired",
    () => {

        assert.ok(

            fs.existsSync(
                liveCompetitionControllerPath
            ),

            "Live competition controller must exist."

        );


        const controllerSource =
            fs.readFileSync(
                liveCompetitionControllerPath,
                "utf8"
            );


        assert.equal(

            controllerSource.includes(
                "updateQueueDeclaration"
            ),

            false,

            "Controller must not import or expose the legacy queue declaration mutation."

        );

    }
);


// =====================================
// TEST 3
// =====================================

test(
    "Feature 3.8B - legacy queue declaration route is retired",
    () => {

        assert.ok(

            fs.existsSync(
                liveCompetitionRoutesPath
            ),

            "Live competition routes must exist."

        );


        const routeSource =
            fs.readFileSync(
                liveCompetitionRoutesPath,
                "utf8"
            );


        assert.equal(

            routeSource.includes(
                "/queue-declaration"
            ),

            false,

            "The legacy /queue-declaration route must no longer be active."

        );

    }
);


// =====================================
// TEST 4
//
// Search only application source.
//
// IMPORTANT:
// The contract test itself is excluded.
// Otherwise it naturally contains the
// strings it is checking for.
// =====================================

test(
    "Feature 3.8B - no active source reference remains for legacy queue declaration route",
    () => {

        const projectRoot =
            path.resolve(
                backendRoot,
                ".."
            );


        const sourceRoots = [

            path.join(
                projectRoot,
                "Backend"
            ),

            path.join(
                projectRoot,
                "Frontend"
            ),

        ];


        const ignoredDirectories =
            new Set([

                "node_modules",
                ".git",
                "dist",
                "build",

            ]);


        const sourceExtensions =
            new Set([

                ".js",
                ".jsx",
                ".ts",
                ".tsx",
                ".mjs",
                ".cjs",

            ]);


        const references = [];


        const walk =
            (directory) => {

                if (
                    !fs.existsSync(
                        directory
                    )
                ) {

                    return;

                }


                for (
                    const item
                    of fs.readdirSync(
                        directory,
                        {
                            withFileTypes:
                                true,
                        }
                    )
                ) {

                    if (
                        ignoredDirectories.has(
                            item.name
                        )
                    ) {

                        continue;

                    }


                    const itemPath =
                        path.join(
                            directory,
                            item.name
                        );


                    // ---------------------------------
                    // Skip this contract test itself.
                    // ---------------------------------

                    if (
                        path.resolve(
                            itemPath
                        ) ===
                        path.resolve(
                            __filename
                        )
                    ) {

                        continue;

                    }


                    if (
                        item.isDirectory()
                    ) {

                        walk(
                            itemPath
                        );

                        continue;

                    }


                    if (
                        !sourceExtensions.has(
                            path.extname(
                                item.name
                            )
                        )
                    ) {

                        continue;

                    }


                    const source =
                        fs.readFileSync(
                            itemPath,
                            "utf8"
                        );


                    if (
                        source.includes(
                            "/queue-declaration"
                        ) ||
                        source.includes(
                            "updateQueueDeclaration"
                        )
                    ) {

                        references.push(
                            itemPath
                        );

                    }

                }

            };


        for (
            const sourceRoot
            of sourceRoots
        ) {

            walk(
                sourceRoot
            );

        }


        assert.deepEqual(

            references,

            [],

            `Legacy queue declaration references remain:\n${references.join("\n")}`

        );

    }
);