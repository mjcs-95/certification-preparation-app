/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.demoBank = {
    version: "1.0",
    title: "Certification preparation demo",
    questions: [
        {
            id: "demo-mc-01",
            type: "multiple-choice",
            category: "Cloud fundamentals",
            question: "Which characteristic lets you increase or reduce resources as demand changes?",
            description: "Select one answer.",
            options: [
                { id: "a", text: "Elasticity" },
                { id: "b", text: "Latency" },
                { id: "c", text: "Reserved capacity" },
                { id: "d", text: "Encryption" },
            ],
            correctAnswers: ["a"],
            explanation: "Elasticity adapts available capacity to changes in demand.",
            source: "Demo bank",
        },
        {
            id: "demo-mr-01",
            type: "multiple-response",
            category: "Security",
            question: "Which two practices reduce the risk associated with credentials?",
            description: "Select exactly two answers.",
            options: [
                { id: "a", text: "Apply least privilege" },
                { id: "b", text: "Share an administrator account" },
                { id: "c", text: "Enable multifactor authentication" },
                { id: "d", text: "Store keys in source code" },
            ],
            correctAnswers: ["a", "c"],
            explanation: "Least privilege limits account impact, while MFA adds another verification factor.",
            source: "Demo bank",
        },
        {
            id: "demo-tf-01",
            type: "true-false",
            category: "Governance",
            question: "A preventive policy can block resources that violate a rule from being created.",
            options: [
                { id: "true", text: "True" },
                { id: "false", text: "False" },
            ],
            correctAnswers: ["true"],
            explanation: "Preventive policies block non-compliant actions before they are completed.",
            source: "Demo bank",
        },
        {
            id: "demo-scenario-01",
            type: "scenario",
            category: "Architecture",
            scenario:
                "An online store receives unpredictable traffic spikes. Its web tier is stateless and demand can multiply within minutes.",
            question: "Which approach best responds to this pattern?",
            description: "Consider both availability and cost.",
            options: [
                { id: "a", text: "One very large instance" },
                { id: "b", text: "Horizontal autoscaling behind a load balancer" },
                { id: "c", text: "Manually increase storage" },
                { id: "d", text: "Disable monitoring" },
            ],
            correctAnswers: ["b"],
            explanation:
                "Because there is no local state, multiple instances can scale horizontally behind a load balancer.",
            source: "Demo bank",
        },
        {
            id: "demo-match-01",
            type: "matching",
            category: "Services",
            question: "Match each need with the most appropriate service type.",
            description: "Select an item on the left, then select its match on the right.",
            leftItems: [
                { id: "l1", text: "Run event-driven code" },
                { id: "l2", text: "Store objects" },
                { id: "l3", text: "Distribute traffic" },
            ],
            rightItems: [
                { id: "r1", text: "Object storage" },
                { id: "r2", text: "Serverless functions" },
                { id: "r3", text: "Load balancer" },
            ],
            correctMatches: { l1: "r2", l2: "r1", l3: "r3" },
            explanation: "Each service addresses a specific architecture responsibility.",
            source: "Demo bank",
        },
        {
            id: "demo-fill-01",
            type: "fill-blank",
            category: "Continuity",
            question:
                "The {{rto}} defines the maximum time to restore service, while the {{rpo}} defines acceptable data loss measured in time.",
            description: "Complete both concepts.",
            blanks: [
                { id: "rto", options: ["RTO", "RPO", "SLA"], correctAnswer: "RTO" },
                { id: "rpo", options: ["MTTR", "RPO", "TCO"], correctAnswer: "RPO" },
            ],
            explanation: "RTO focuses on recovery time; RPO focuses on the recovery point for data.",
            source: "Demo bank",
        },
    ],
};
