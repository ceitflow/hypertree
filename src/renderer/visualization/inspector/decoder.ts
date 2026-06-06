export enum FileType {
  Text = 'text',
  Image = 'image',
  Binary = 'binary'
}

export class Decoder {
  static decode(source: string) {
    // todo add few known encodings test (png, jpg, svg etc.) and we return a flag with found type.
  }
}
