import { MarshalWith, MarshallerConstructor, MarshalFrom, ArrayOf } from 'raynor'
import * as r from 'raynor'

// We want some things.

// A single point-of-truth class/object which depends on a bunch of entities annotated with Raynor
// Ultimately this can be just a JSON. But it's a bad way to specify things, so something looking
// like a class would be the best.

async function nop<T>(..._args: any[]): Promise<T> {
    throw new Error('Cannot invoke this function directly');
}

interface RpcParamDescriptor<T> {
    index: number;
    ctor: MarshallerConstructor<T>;
    required: boolean;
}

interface RpcOutputDescriptor<T> {
    ctor: MarshallerConstructor<T>;
}

interface RpcMethodDescriptor<T> {
    name: string;
    input: Array<RpcParamDescriptor<any>>;
    hasOutput: boolean;
    output: RpcOutputDescriptor<T>|null;
    errors: Set<any>;
}

interface RpcSchema {
    methods: Map<string, RpcMethodDescriptor<any>>;
}

function _ensureSchema(target: any) {
    if (!(target.hasOwnProperty('__schema'))) {
        target.__schema = {
            methods: new Map<string, RpcMethodDescriptor<any>>()
        } as RpcSchema;
    }
}

function _ensureMethodDescription(target: any, methodName: string) {
    if (!target.__schema.methods.has(methodName)) {
        target.__schema.methods.set(methodName, {
            name: methodName,
            input: [],
            hasOutput: false,
            output: null
        });
    }
}

function Rpc() {
    return function(target: any, methodName: string) {
        _ensureSchema(target);
        _ensureMethodDescription(target, methodName);
    }
}

function RpcOutput<T>(marshallerCtor: MarshallerConstructor<T>) {
    return function(target: any, methodName: string) {
        _ensureSchema(target);
        _ensureMethodDescription(target, methodName);

        target.__schema.methods.get(methodName).hasOutput = true;
        target.__schema.methods.get(methodName).output = {
            ctor: marshallerCtor
        };
    }
}

function RpcThrows(...errorConstructors: any[]) {
    return function(target: any, methodName: string) {
        _ensureSchema(target);
        _ensureMethodDescription(target, methodName);

        target.__schema.methods.get(methodName).errors = new Set<any>(errorConstructors);
    }
}

function RpcParam<T>(marshallerCtor: MarshallerConstructor<T>) {
    return function(target: any, methodName: string, parameterIndex: number) {
        _ensureSchema(target);
        _ensureMethodDescription(target, methodName);

        target.__schema.methods.get(methodName).input[parameterIndex] = {
            index: parameterIndex,
            ctor: marshallerCtor,
            required: true
        };
    }
}

export class TestBookError extends Error {
    constructor() {
        super('Tried to do something with a test book!');
    }
}

export class Book {
    @MarshalWith(r.IdMarshaller)
    id: number = 0;
    @MarshalWith(r.StringMarshaller)
    title: string = '';
}

export class LibraryService {
    @Rpc()
    @RpcOutput(ArrayOf(MarshalFrom(Book)))
    async getBooks(): Promise<Book[]> {
        return nop<Book[]>();
    }

    @Rpc()
    @RpcOutput(MarshalFrom(Book))
    @RpcThrows(TestBookError)
    async updateBook(
        @RpcParam(r.IdMarshaller) bookId: number,
        @RpcParam(r.StringMarshaller) newTitle: string): Promise<Book> {
        return nop<Book>(bookId, newTitle);
    }
}

export class LibraryServiceServer extends LibraryService {
    async getBooks(): Promise<Book[]> {
        return [];
    }

    async updateBook(_bookId: number, _newTitle: string): Promise<Book> {
        return new Book();
    }
}

const ll = new LibraryServiceServer();
console.log((ll as any).__schema);
ll.getBooks().then(l => console.log(JSON.stringify(l)));

// A way to build a client object from the point-of-truth class/object. This has a bunch of async
// methods for each one defined there, and allows "almost-local" behaviour. It should be modulated
// by a transport object - a Http/Https type thing. But with other possibilities as well.

// A way to build a server object from the point-of-truth class/object. It should be modulated
// by a transport object - a Http/Https type thing. Possibly Express based.

// TODO: server creation needs to take care that all @Rpc methods are overriden.
