export default interface CreateGroupRequest {
    name: string;
    members: number[];
    description?: string;
}