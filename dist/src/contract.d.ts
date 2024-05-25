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
    rawMethods: {
        create: (...args: [AddValue] & any[]) => Promise<AddValue>;
        merge: (...args: [SelfProof<unknown, unknown>, SelfProof<unknown, unknown>] & any[]) => Promise<AddValue>;
    };
} & {
    create: (...args: [AddValue] & any[]) => Promise<import("o1js").Proof<undefined, AddValue>>;
    merge: (...args: [SelfProof<unknown, unknown>, SelfProof<unknown, unknown>] & any[]) => Promise<import("o1js").Proof<undefined, AddValue>>;
};
declare const AddProgramProof_base: {
    new ({ proof, publicInput, publicOutput, maxProofsVerified, }: {
        proof: unknown;
        publicInput: undefined;
        publicOutput: AddValue;
        maxProofsVerified: 0 | 2 | 1;
    }): {
        verify(): void;
        verifyIf(condition: import("o1js/dist/node/lib/provable/bool").Bool): void;
        publicInput: undefined;
        publicOutput: AddValue;
        proof: unknown;
        maxProofsVerified: 0 | 2 | 1;
        shouldVerify: import("o1js/dist/node/lib/provable/bool").Bool;
        toJSON(): import("o1js").JsonProof;
    };
    publicInputType: import("o1js/dist/node/lib/provable/types/struct").ProvablePureExtended<undefined, undefined, null>;
    publicOutputType: typeof AddValue;
    tag: () => {
        name: string;
        publicInputType: import("o1js/dist/node/lib/provable/types/struct").ProvablePureExtended<undefined, undefined, null>;
        publicOutputType: typeof AddValue;
    };
    fromJSON<S extends (new (...args: any) => import("o1js").Proof<unknown, unknown>) & {
        prototype: import("o1js").Proof<any, any>;
        fromJSON: typeof import("o1js").Proof.fromJSON;
        dummy: typeof import("o1js").Proof.dummy;
        publicInputType: import("o1js").FlexibleProvablePure<any>;
        publicOutputType: import("o1js").FlexibleProvablePure<any>;
        tag: () => {
            name: string;
        };
    } & {
        prototype: import("o1js").Proof<unknown, unknown>;
    }>(this: S, { maxProofsVerified, proof: proofString, publicInput: publicInputJson, publicOutput: publicOutputJson, }: import("o1js").JsonProof): Promise<import("o1js").Proof<import("o1js").InferProvable<S["publicInputType"]>, import("o1js").InferProvable<S["publicOutputType"]>>>;
    dummy<Input, OutPut>(publicInput: Input, publicOutput: OutPut, maxProofsVerified: 0 | 2 | 1, domainLog2?: number | undefined): Promise<import("o1js").Proof<Input, OutPut>>;
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
    createAddValue(address: PublicKey, addValue: AddValue): void;
}
export {};
