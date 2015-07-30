function getJson(filename)
{
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var f = fso.opentextfile("C:/demov1.0/"+filename,1,0);
	var str = "";
	while (!f.AtEndOfStream){
		str += f.ReadLine()+"\n";
	}
	f.close();
	
	return str;
}
function putJson(filename,json_str)
{
	var fso=new ActiveXObject("Scripting.FileSystemObject");
	var f=fso.createtextfile("C:/demov1.0/"+filename,2,true);
	f.writeLine("[{");
	f.writeLine(json_str);
	f.writeLine("}]");
	f.close();
}
function putYwczson(json_str)
{
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var f = fso.opentextfile("C:\\demov1.0\\commons\\json\\ywcz.json",1,0);
	var str = "";
	while (!f.AtEndOfStream){
		str += f.ReadLine()+"\n";
		str = str.replace("\[","");
		str = str.replace("\]","");
	}
	f.close();
	
	var fso=new ActiveXObject("Scripting.FileSystemObject");
	var f=fso.createtextfile("C:\\demov1.0\\commons\\json\\ywcz.json",8,false);
	f.writeLine("[");
	if(str==null || str==""){
		f.writeLine("{");
	}else{
		f.writeLine(str+",{");
	}
	f.writeLine(json_str);
	f.writeLine("}");
	f.writeLine("]");
	f.close();
}