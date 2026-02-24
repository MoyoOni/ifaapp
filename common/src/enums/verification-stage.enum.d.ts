export declare enum VerificationStage {
    APPLICATION = "APPLICATION",
    COUNCIL_REVIEW = "COUNCIL_REVIEW",
    CERTIFICATION = "CERTIFICATION",
    ETHICS_AGREEMENT = "ETHICS_AGREEMENT"
}
export type VerificationStageType = keyof typeof VerificationStage;
