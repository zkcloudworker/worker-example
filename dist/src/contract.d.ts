import { SelfProof, State, TokenContract, AccountUpdateForest, PublicKey, UInt64 } from "o1js";
export declare const limit = 1000;
declare const AddValue_base: (new (value: {
    value: UInt64;
    limit: UInt64;
}) => {
    value: UInt64;
    limit: UInt64;
}) & {
    _isStruct: true;
} & Omit<import("o1js/dist/node/lib/provable/types/provable-intf").Provable<{
    value: UInt64;
    limit: UInt64;
}, {
    value: bigint;
    limit: bigint;
}>, "fromFields"> & {
    fromFields: (fields: import("o1js/dist/node/lib/provable/field").Field[]) => {
        value: UInt64;
        limit: UInt64;
    };
} & {
    fromValue: (value: {
        value: bigint | UInt64;
        limit: bigint | UInt64;
    }) => {
        value: UInt64;
        limit: UInt64;
    };
    toInput: (x: {
        value: UInt64;
        limit: UInt64;
    }) => {
        fields?: import("o1js/dist/node/lib/provable/field").Field[] | undefined;
        packed?: [import("o1js/dist/node/lib/provable/field").Field, number][] | undefined;
    };
    toJSON: (x: {
        value: UInt64;
        limit: UInt64;
    }) => {
        value: string;
        limit: string;
    };
    fromJSON: (x: {
        value: string;
        limit: string;
    }) => {
        value: UInt64;
        limit: UInt64;
    };
    empty: () => {
        value: UInt64;
        limit: UInt64;
    };
};
export declare class AddValue extends AddValue_base {
    toState(): import("o1js/dist/node/lib/provable/field").Field[];
}
declare const AddValueEvent_base: (new (value: {
    addValue: AddValue;
    address: PublicKey;
}) => {
    addValue: AddValue;
    address: PublicKey;
}) & {
    _isStruct: true;
} & Omit<import("o1js/dist/node/lib/provable/types/provable-intf").Provable<{
    addValue: AddValue;
    address: PublicKey;
}, {
    addValue: {
        value: bigint;
        limit: bigint;
    };
    address: {
        x: bigint;
        isOdd: boolean;
    };
}>, "fromFields"> & {
    fromFields: (fields: import("o1js/dist/node/lib/provable/field").Field[]) => {
        addValue: AddValue;
        address: PublicKey;
    };
} & {
    fromValue: (value: {
        addValue: AddValue | {
            value: bigint | UInt64;
            limit: bigint | UInt64;
        };
        address: PublicKey | {
            x: bigint | import("o1js/dist/node/lib/provable/field").Field;
            isOdd: boolean | import("o1js/dist/node/lib/provable/bool").Bool;
        };
    }) => {
        addValue: AddValue;
        address: PublicKey;
    };
    toInput: (x: {
        addValue: AddValue;
        address: PublicKey;
    }) => {
        fields?: import("o1js/dist/node/lib/provable/field").Field[] | undefined;
        packed?: [import("o1js/dist/node/lib/provable/field").Field, number][] | undefined;
    };
    toJSON: (x: {
        addValue: AddValue;
        address: PublicKey;
    }) => {
        addValue: {
            value: string;
            limit: string;
        };
        address: string;
    };
    fromJSON: (x: {
        addValue: {
            value: string;
            limit: string;
        };
        address: string;
    }) => {
        addValue: AddValue;
        address: PublicKey;
    };
    empty: () => {
        addValue: AddValue;
        address: PublicKey;
    };
};
export declare class AddValueEvent extends AddValueEvent_base {
}
export declare const AddProgram: {
    name: string;
    compile: (options?: {
        cache?: import("o1js").Cache | undefined;
        forceRecompile?: boolean | undefined;
        proofsEnabled?: boolean | undefined;
    } | undefined) => Promise<{
        verificationKey: {
            data: string;
            hash: import("o1js/dist/node/lib/provable/field").Field;
        };
    }>;
    verify: (proof: import("o1js").Proof<undefined, AddValue>) => Promise<boolean>;
    digest: () => Promise<string>;
    analyzeMethods: () => Promise<{
        create: {
            rows: number;
            digest: string;
            gates: import("o1js/dist/node/snarky").Gate[];
            publicInputSize: number;
            print(): void;
            summary(): Partial<Record<import("o1js/dist/node/snarky").GateType | "Total rows", number>>;
        };
        merge: {
            rows: number;
            digest: string;
            gates: import("o1js/dist/node/snarky").Gate[];
            publicInputSize: number;
            print(): void;
            summary(): Partial<Record<import("o1js/dist/node/snarky").GateType | "Total rows", number>>;
        };
    }>;
    publicInputType: import("o1js/dist/node/lib/provable/types/struct").ProvablePureExtended<undefined, undefined, null>;
    publicOutputType: typeof AddValue;
    privateInputTypes: {
        create: [typeof AddValue];
        merge: [typeof SelfProof, typeof SelfProof];
    };
    auxiliaryOutputTypes: {
        create: undefined;
        merge: undefined;
    };
    rawMethods: {
        create: (...args: [AddValue] & any[]) => Promise<{
            publicOutput: AddValue;
        }>;
        merge: (...args: [SelfProof<unknown, unknown>, SelfProof<unknown, unknown>] & any[]) => Promise<{
            publicOutput: AddValue;
        }>;
    };
    proofsEnabled: boolean;
    setProofsEnabled(proofsEnabled: boolean): void;
} & {
    create: (...args: [AddValue] & any[]) => Promise<{
        proof: import("o1js").Proof<undefined, AddValue>;
        auxiliaryOutput: undefined;
    }>;
    merge: (...args: [SelfProof<unknown, unknown>, SelfProof<unknown, unknown>] & any[]) => Promise<{
        proof: import("o1js").Proof<undefined, AddValue>;
        auxiliaryOutput: undefined;
    }>;
};
declare const AddProgramProof_base: {
    new ({ proof, publicInput, publicOutput, maxProofsVerified, }: {
        proof: unknown;
        publicInput: undefined;
        publicOutput: AddValue;
        maxProofsVerified: 0 | 2 | 1;
    }): import("o1js").Proof<undefined, AddValue>;
    fromJSON<S extends import("o1js/dist/node/lib/util/types").Subclass<typeof import("o1js").Proof>>(this: S, { maxProofsVerified, proof: proofString, publicInput: publicInputJson, publicOutput: publicOutputJson, }: import("o1js").JsonProof): Promise<import("o1js").Proof<import("o1js").InferProvable<S["publicInputType"]>, import("o1js").InferProvable<S["publicOutputType"]>>>;
    dummy<Input, OutPut>(publicInput: Input, publicOutput: OutPut, maxProofsVerified: 0 | 2 | 1, domainLog2?: number | undefined): Promise<import("o1js").Proof<Input, OutPut>>;
    readonly provable: {
        toFields: (value: import("o1js").Proof<any, any>) => import("o1js/dist/node/lib/provable/field").Field[];
        toAuxiliary: (value?: import("o1js").Proof<any, any> | undefined) => any[];
        fromFields: (fields: import("o1js/dist/node/lib/provable/field").Field[], aux: any[]) => import("o1js").Proof<any, any>;
        sizeInFields(): number;
        check: (value: import("o1js").Proof<any, any>) => void;
        toValue: (x: import("o1js").Proof<any, any>) => import("o1js/dist/node/lib/proof-system/proof").ProofValue<any, any>;
        fromValue: (x: import("o1js").Proof<any, any> | import("o1js/dist/node/lib/proof-system/proof").ProofValue<any, any>) => import("o1js").Proof<any, any>;
        toCanonical?: ((x: import("o1js").Proof<any, any>) => import("o1js").Proof<any, any>) | undefined;
    };
    publicInputType: import("o1js").FlexibleProvablePure<any>;
    publicOutputType: import("o1js").FlexibleProvablePure<any>;
    tag: () => {
        name: string;
    };
    publicFields(value: import("o1js").ProofBase<any, any>): {
        input: import("o1js/dist/node/lib/provable/field").Field[];
        output: import("o1js/dist/node/lib/provable/field").Field[];
    };
} & {
    provable: import("o1js").Provable<import("o1js").Proof<undefined, AddValue>, import("o1js/dist/node/lib/proof-system/proof").ProofValue<undefined, {
        value: bigint;
        limit: bigint;
    }>>;
};
export declare class AddProgramProof extends AddProgramProof_base {
}
export declare class AddContract extends TokenContract {
    limit: State<UInt64>;
    init(): void;
    approveBase(forest: AccountUpdateForest): Promise<void>;
    events: {
        addValue: typeof AddValueEvent;
    };
    addOne(address: PublicKey, addValue: AddValue): Promise<void>;
    addMany(address: PublicKey, proof: AddProgramProof): Promise<void>;
    createAddValue(address: PublicKey, addValue: AddValue): Promise<void>;
}
export {};
