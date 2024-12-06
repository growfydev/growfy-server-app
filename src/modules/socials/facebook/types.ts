export interface FacebookMessagePostFields {
	message: string;
}

export interface FacebookPhotoPostFields {
	url: string;
	message: string;
}

export interface PostData {
	accountId: string;
	token: string;
}

export type PostFields = FacebookMessagePostFields | FacebookPhotoPostFields;
