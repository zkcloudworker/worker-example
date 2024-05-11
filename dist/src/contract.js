"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddContract = exports.AddProgramProof = exports.AddProgram = exports.AddValueEvent = exports.AddValue = exports.limit = void 0;
const o1js_1 = require("o1js");
exports.limit = 1000;
class AddValue extends (0, o1js_1.Struct)({
    value: o1js_1.UInt64,
    limit: o1js_1.UInt64,
}) {
    toState() {
        return [this.value.value, this.limit.value];
    }
}
exports.AddValue = AddValue;
class AddValueEvent extends (0, o1js_1.Struct)({
    addValue: AddValue,
    address: o1js_1.PublicKey,
}) {
}
exports.AddValueEvent = AddValueEvent;
exports.AddProgram = (0, o1js_1.ZkProgram)({
    name: "AddProgram",
    publicOutput: AddValue,
    methods: {
        create: {
            privateInputs: [AddValue],
            async method(addValue) {
                addValue.value.assertLessThan(addValue.limit, "Value exceeds limit");
                addValue.value.assertGreaterThan(o1js_1.UInt64.from(0), "Value must be positive");
                return addValue;
            },
        },
        merge: {
            privateInputs: [o1js_1.SelfProof, o1js_1.SelfProof],
            async method(proof1, proof2) {
                proof1.verify();
                proof2.verify();
                proof1.publicOutput.limit.assertEquals(proof2.publicOutput.limit);
                return new AddValue({
                    value: proof1.publicOutput.value.add(proof2.publicOutput.value),
                    limit: proof1.publicOutput.limit,
                });
            },
        },
    },
});
class AddProgramProof extends o1js_1.ZkProgram.Proof(exports.AddProgram) {
}
exports.AddProgramProof = AddProgramProof;
class AddContract extends o1js_1.TokenContract {
    constructor() {
        super(...arguments);
        this.limit = (0, o1js_1.State)();
        this.events = {
            addValue: AddValueEvent,
        };
    }
    init() {
        super.init();
        this.limit.set(o1js_1.UInt64.from(exports.limit));
    }
    async approveBase(forest) {
        throw Error("transfers are not allowed");
    }
    async addOne(address, addValue) {
        const limit = this.limit.getAndRequireEquals();
        addValue.value.assertLessThan(limit, "Value exceeds limit");
        addValue.value.assertGreaterThan(o1js_1.UInt64.from(0), "Value must be positive");
        this.createAddValue(address, addValue);
    }
    async addMany(address, proof) {
        const limit = this.limit.getAndRequireEquals();
        limit.assertEquals(proof.publicOutput.limit);
        proof.verify();
        this.createAddValue(address, proof.publicOutput);
    }
    createAddValue(address, addValue) {
        const tokenId = this.deriveTokenId();
        const update = o1js_1.AccountUpdate.createSigned(address, tokenId);
        update.account.balance.getAndRequireEquals().assertEquals(o1js_1.UInt64.from(0));
        this.internal.mint({
            address: address,
            amount: addValue.value,
        });
        const state = addValue.toState();
        update.body.update.appState = [
            { isSome: (0, o1js_1.Bool)(true), value: state[0] },
            { isSome: (0, o1js_1.Bool)(true), value: state[1] },
            { isSome: (0, o1js_1.Bool)(false), value: (0, o1js_1.Field)(0) },
            { isSome: (0, o1js_1.Bool)(false), value: (0, o1js_1.Field)(0) },
            { isSome: (0, o1js_1.Bool)(false), value: (0, o1js_1.Field)(0) },
            { isSome: (0, o1js_1.Bool)(false), value: (0, o1js_1.Field)(0) },
            { isSome: (0, o1js_1.Bool)(false), value: (0, o1js_1.Field)(0) },
            { isSome: (0, o1js_1.Bool)(false), value: (0, o1js_1.Field)(0) },
        ];
        this.emitEvent("addValue", new AddValueEvent({ addValue, address }));
    }
}
exports.AddContract = AddContract;
__decorate([
    (0, o1js_1.state)(o1js_1.UInt64),
    __metadata("design:type", Object)
], AddContract.prototype, "limit", void 0);
__decorate([
    o1js_1.method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [o1js_1.PublicKey, AddValue]),
    __metadata("design:returntype", Promise)
], AddContract.prototype, "addOne", null);
__decorate([
    o1js_1.method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [o1js_1.PublicKey, AddProgramProof]),
    __metadata("design:returntype", Promise)
], AddContract.prototype, "addMany", null);
