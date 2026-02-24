"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Currency = exports.WithdrawalStatus = exports.EscrowStatus = exports.EscrowType = exports.TransactionStatus = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["PAYMENT"] = "PAYMENT";
    TransactionType["REFUND"] = "REFUND";
    TransactionType["ESCROW_HOLD"] = "ESCROW_HOLD";
    TransactionType["ESCROW_RELEASE"] = "ESCROW_RELEASE";
    TransactionType["TRANSFER"] = "TRANSFER";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["CANCELLED"] = "CANCELLED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var EscrowType;
(function (EscrowType) {
    EscrowType["BOOKING"] = "BOOKING";
    EscrowType["ORDER"] = "ORDER";
    EscrowType["TUTOR_SESSION"] = "TUTOR_SESSION";
    EscrowType["GUIDANCE_PLAN"] = "GUIDANCE_PLAN";
})(EscrowType || (exports.EscrowType = EscrowType = {}));
var EscrowStatus;
(function (EscrowStatus) {
    EscrowStatus["HOLD"] = "HOLD";
    EscrowStatus["RELEASED"] = "RELEASED";
    EscrowStatus["PARTIALLY_RELEASED"] = "PARTIALLY_RELEASED";
    EscrowStatus["DISPUTED"] = "DISPUTED";
    EscrowStatus["CANCELLED"] = "CANCELLED";
    EscrowStatus["EXPIRED"] = "EXPIRED";
})(EscrowStatus || (exports.EscrowStatus = EscrowStatus = {}));
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "PENDING";
    WithdrawalStatus["APPROVED"] = "APPROVED";
    WithdrawalStatus["REJECTED"] = "REJECTED";
    WithdrawalStatus["PROCESSED"] = "PROCESSED";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
var Currency;
(function (Currency) {
    Currency["NGN"] = "NGN";
    Currency["USD"] = "USD";
    Currency["GBP"] = "GBP";
    Currency["CAD"] = "CAD";
    Currency["EUR"] = "EUR";
})(Currency || (exports.Currency = Currency = {}));
//# sourceMappingURL=wallet.enum.js.map