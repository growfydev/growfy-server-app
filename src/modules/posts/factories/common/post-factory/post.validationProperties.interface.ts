import { JsonValue } from '@prisma/client/runtime/library';

export interface PostValidationProperties {
	validation(
		typePostName: string,
		fields: JsonValue,
		properties: JsonValue,
	): Promise<void>;
}

export interface VideoValidationProperties {
	validFormats: string[];
	maxSize: number;
	minDimensions: { width: number; height: number };
	maxDimensions: { width: number; height: number };
	minDuration: number;
	maxDuration: number;
	frameRateRange: { min: number; max: number };
	audioBitrateMin: number;
	audioSampleRate: number;
	aspectRatio: string;
	videoCodec: string[];
	audioCodec: string;
	chromaSubsampling: string;
	scanType: string;
	gopType: string;
	gopLengthRange: { min: number; max: number };
}
