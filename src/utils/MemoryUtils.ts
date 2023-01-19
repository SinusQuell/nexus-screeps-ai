
module.exports = {
    CheckAlly: function(user: string) {
        if (!Memory.allies) Memory.allies = [];
        let allies = Memory.allies;
        for (let i = 0; i < allies.length; i++) {
            if (user == allies[i]) {
                return true;
            }
        }
        return false;
    },
}
