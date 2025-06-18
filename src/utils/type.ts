
export interface PaginationParams {
    limit: number;
    cursor?: Date;      
    direction: 'before' | 'after';
}

export interface PaginationResponse<T>{
    data: T[];
    hasMore: boolean;
    nextCursor?: Date;
}