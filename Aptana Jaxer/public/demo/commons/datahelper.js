/**
 * Created by Him on 2015-07-21.
 */
function getmyrecord(tablename) {
    return getDBresult("select * from " + tablename, tablename);
}
getmyrecord.proxy = true;
function getDBresult(sql_str, tablename) {
    var resultSet = Jaxer.DB.execute(sql_str);
    var result = "";
    if (resultSet.rows.length == 0) {
        result = "";
    }
    else {
        return resultSet.rows;
    }
}