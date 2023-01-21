export class SourceHelper  {

    public getWalkableSpaces(source: Source) {
        if (!Game.rooms[source.room.name]) return; // check for vision

        const fields = Game.rooms[source.room.name].lookForAtArea(LOOK_TERRAIN, source.pos.y-1, source.pos.x-1, source.pos.y+1, source.pos.x+1, true);
        const accessibleFields = 9-_.countBy( fields , "terrain" ).wall;
        return accessibleFields;
    }

}
