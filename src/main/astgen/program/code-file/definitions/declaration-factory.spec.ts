// todo test later
//  exotic examples to test
// declare const objectType: <T extends ZodRawShape>(shape: T, params?: RawCreateParams) => ZodObject<T, "strip", ZodTypeAny, { [k_1 in keyof objectUtil.addQuestionMarks<baseObjectOutputType<T>, { [k in keyof baseObjectOutputType<T>]: undefined extends baseObjectOutputType<T>[k] ? never : k; }[keyof T]>]: objectUtil.addQuestionMarks<baseObjectOutputType<T>, { [k in keyof baseObjectOutputType<T>]: undefined extends baseObjectOutputType<T>[k] ? never : k; }[keyof T]>[k_1]; }, { [k_2 in keyof baseObjectInputType<T>]: baseObjectInputType<T>[k_2]; }>;
